defmodule Tamayotchi.PortfolioAnalytics do
  @moduledoc """
  Normalizes portfolio entries and derives shared portfolio metrics.

  Raw portfolio data contains two kinds of rows:

    * contribution rows: money added to a provider over time
    * year-end rows: Dec 31 snapshots marked with `isYearEndValue`

  The helpers in this module keep the financial calculations shared between the
  provider detail pages and the projection lab so both places explain the same
  numbers.
  """

  @type entry :: %{
          provider: binary(),
          date: binary(),
          amount: float(),
          year_end?: boolean(),
          date_obj: Date.t()
        }

  @type year_end_snapshot :: %{
          provider: binary(),
          date: binary(),
          date_obj: Date.t(),
          year: integer(),
          year_end?: true,
          amount: float(),
          end_value: float(),
          contributed_to_date: float(),
          previous_year: integer() | nil,
          increase_amount: float(),
          increase_percentage: float() | nil,
          year_increase_amount: float(),
          year_increase_percentage: float() | nil
        }

  @spec entries_for_currency(map(), binary()) :: [entry()]
  def entries_for_currency(data, currency_code) when is_map(data) and is_binary(currency_code) do
    data
    |> Enum.filter(fn {_provider, details} ->
      Map.get(details, "currencyCode") == currency_code
    end)
    |> Enum.flat_map(fn {provider, details} ->
      details
      |> Map.get("content", [])
      |> normalize_entries(provider)
    end)
    |> sort_entries_by_date()
  end

  @spec normalize_entries([map()], binary()) :: [entry()]
  def normalize_entries(content, provider_name) do
    content
    |> Enum.map(fn entry ->
      %{
        provider: provider_name,
        date: Map.get(entry, "date"),
        amount: numeric_amount(Map.get(entry, "amount")),
        year_end?: Map.get(entry, "isYearEndValue", false),
        date_obj: parse_date(Map.get(entry, "date"))
      }
    end)
    |> Enum.filter(&is_struct(&1.date_obj, Date))
    |> sort_entries_by_date()
  end

  @spec sort_entries_by_date([entry()]) :: [entry()]
  def sort_entries_by_date(entries) do
    Enum.sort_by(entries, fn entry -> {Date.to_erl(entry.date_obj), entry.provider} end)
  end

  @spec contribution_entries([entry()]) :: [entry()]
  def contribution_entries(entries), do: Enum.reject(entries, & &1.year_end?)

  @spec current_tracked_value([entry()]) :: float()
  def current_tracked_value(entries) do
    entries
    |> Enum.map(& &1.provider)
    |> Enum.uniq()
    |> Enum.reduce(0.0, fn provider, acc ->
      acc + current_provider_value(entries, provider)
    end)
  end

  @spec year_end_snapshots([entry()]) :: [year_end_snapshot()]
  def year_end_snapshots(entries) do
    contribution_entries = contribution_entries(entries)
    providers = entries |> Enum.map(& &1.provider) |> Enum.uniq()

    entries
    |> Enum.filter(& &1.year_end?)
    |> Enum.group_by(fn entry -> entry.date_obj.year end)
    |> Enum.map(fn {year, year_end_entries} ->
      date_obj = year_end_entries |> Enum.map(& &1.date_obj) |> Enum.max(Date)

      provider_values =
        providers
        |> Enum.map(fn provider ->
          {provider, provider_value_at_year_end(entries, provider, date_obj, year)}
        end)
        |> Enum.filter(fn {_provider, value} -> value > 0 end)

      end_value = Enum.reduce(provider_values, 0.0, fn {_provider, value}, acc -> acc + value end)

      provider_names =
        provider_values |> Enum.map(fn {provider, _value} -> provider end) |> MapSet.new()

      contributed_to_date =
        contribution_entries
        |> Enum.filter(fn entry ->
          MapSet.member?(provider_names, entry.provider) and
            Date.compare(entry.date_obj, date_obj) in [:lt, :eq]
        end)
        |> Enum.reduce(0.0, fn entry, acc -> acc + entry.amount end)

      %{
        provider: "YEAR_END",
        date: Date.to_iso8601(date_obj),
        date_obj: date_obj,
        year: year,
        year_end?: true,
        amount: end_value,
        end_value: end_value,
        contributed_to_date: contributed_to_date
      }
    end)
    |> Enum.sort_by(& &1.year)
    |> attach_growth_metrics()
  end

  defp current_provider_value(entries, provider) do
    provider_entries = Enum.filter(entries, &(&1.provider == provider))
    latest_year_end = latest_year_end(provider_entries)

    contributions_after_latest =
      provider_entries
      |> contribution_entries()
      |> Enum.filter(fn entry ->
        is_nil(latest_year_end) or Date.compare(entry.date_obj, latest_year_end.date_obj) == :gt
      end)
      |> sum_amounts()

    case latest_year_end do
      nil -> contributions_after_latest
      entry -> entry.amount + contributions_after_latest
    end
  end

  defp provider_value_at_year_end(entries, provider, date_obj, year) do
    provider_entries = Enum.filter(entries, &(&1.provider == provider))

    same_year_end_value =
      provider_entries
      |> Enum.filter(fn entry -> entry.year_end? and entry.date_obj.year == year end)
      |> sum_amounts()

    if same_year_end_value > 0 do
      same_year_end_value
    else
      latest_year_end =
        provider_entries
        |> Enum.filter(fn entry ->
          entry.year_end? and Date.compare(entry.date_obj, date_obj) != :gt
        end)
        |> Enum.sort_by(& &1.date_obj, Date)
        |> List.last()

      contributions_after_latest =
        provider_entries
        |> contribution_entries()
        |> Enum.filter(fn entry ->
          Date.compare(entry.date_obj, date_obj) != :gt and
            (is_nil(latest_year_end) or
               Date.compare(entry.date_obj, latest_year_end.date_obj) == :gt)
        end)
        |> sum_amounts()

      case latest_year_end do
        nil -> contributions_after_latest
        entry -> entry.amount + contributions_after_latest
      end
    end
  end

  defp attach_growth_metrics(rows) do
    rows
    |> Enum.map_reduce(nil, fn row, previous_row ->
      gain_share_amount = row.end_value - row.contributed_to_date

      gain_share_percentage =
        if row.end_value > 0 do
          gain_share_amount / row.end_value * 100
        end

      contributions_since_previous =
        if previous_row do
          row.contributed_to_date - previous_row.contributed_to_date
        else
          row.contributed_to_date
        end

      year_basis =
        if previous_row do
          previous_row.end_value + contributions_since_previous
        else
          row.contributed_to_date
        end

      year_gain_amount = row.end_value - year_basis

      year_gain_percentage =
        if year_basis > 0 do
          year_gain_amount / year_basis * 100
        end

      row =
        Map.merge(row, %{
          previous_year: previous_row && previous_row.year,
          increase_amount: gain_share_amount,
          increase_percentage: gain_share_percentage,
          year_increase_amount: year_gain_amount,
          year_increase_percentage: year_gain_percentage
        })

      {row, row}
    end)
    |> elem(0)
  end

  defp latest_year_end(entries) do
    entries
    |> Enum.filter(& &1.year_end?)
    |> Enum.sort_by(& &1.date_obj, Date)
    |> List.last()
  end

  defp sum_amounts(entries) do
    Enum.reduce(entries, 0.0, fn entry, acc -> acc + entry.amount end)
  end

  defp parse_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, parsed_date} -> parsed_date
      _ -> nil
    end
  end

  defp parse_date(_date), do: nil

  defp numeric_amount(amount) when is_integer(amount), do: amount * 1.0
  defp numeric_amount(amount) when is_float(amount), do: amount
  defp numeric_amount(_amount), do: 0.0
end
