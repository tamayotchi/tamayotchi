defmodule TamayotchiWeb.ProviderController do
  use TamayotchiWeb, :controller

  alias Tamayotchi.PortfolioData

  @time_ranges ["1M", "3M", "6M", "YTD", "12M", "ALL"]
  @history_orders [
    {"Newest first", "newest"},
    {"Oldest first", "oldest"}
  ]
  @chart_width 960
  @chart_height 360
  @chart_left 54
  @chart_right 24
  @chart_top 20
  @chart_bottom 40

  def show(conn, %{"provider" => provider_slug} = params) do
    with {:ok, provider} <- provider_context(provider_slug) do
      render_platform(conn, params, provider)
    else
      :error -> send_resp(conn, 404, "Provider not found")
    end
  end

  defp render_platform(conn, params, provider) do
    {contribution_entries, year_end_entries} = split_entries(provider.entries)
    {selected_time_range, selected_year, selected_history_order} = selected_filters(params)
    years = available_years(contribution_entries)

    filtered_contributions =
      filter_by_period(contribution_entries, selected_time_range, selected_year)

    filtered_year_end =
      if provider.aggregate? do
        []
      else
        filter_by_period(year_end_entries, selected_time_range, selected_year)
      end

    points = build_points(filtered_contributions)

    conn
    |> put_view(html: TamayotchiWeb.ProviderHTML)
    |> render(:index,
      platform_name: provider.platform_name,
      platform_path: provider.platform_path,
      currency_code: provider.currency_code,
      aggregate?: provider.aggregate?,
      show_compound?: not provider.aggregate?,
      chart: chart_payload(points, filtered_year_end),
      provider_breakdown:
        provider_breakdown(filtered_contributions, provider.providers, provider.aggregate?),
      history_rows: history_rows(points, selected_history_order),
      show_provider_column?: provider.aggregate?,
      stats: stats(points, provider.entries),
      selected_time_range: selected_time_range,
      selected_year: selected_year,
      selected_history_order: selected_history_order,
      time_ranges: @time_ranges,
      year_options: year_options(years),
      history_order_options: @history_orders
    )
  end

  defp provider_context(provider_slug) do
    normalized_slug = String.downcase(provider_slug)

    cond do
      normalized_slug in ["usd", "all-usd", "all_usd"] ->
        aggregate_provider_context("USD")

      normalized_slug in ["cop", "all-cop", "all_cop"] ->
        aggregate_provider_context("COP")

      true ->
        platform_name = String.upcase(provider_slug)

        with {:ok, {currency_code, entries}} <- platform_entries(platform_name) do
          {:ok,
           %{
             platform_name: platform_name,
             platform_path: "/provider/" <> String.downcase(platform_name),
             currency_code: currency_code,
             entries: entries,
             aggregate?: false,
             providers: [platform_name]
           }}
        end
    end
  end

  defp aggregate_provider_context(currency_code) do
    with {:ok, data} <- PortfolioData.load() do
      platforms =
        data
        |> Enum.filter(fn {_provider, details} ->
          Map.get(details, "currencyCode") == currency_code
        end)
        |> Enum.sort_by(fn {provider, _details} -> provider end)

      entries =
        platforms
        |> Enum.flat_map(fn {provider, details} ->
          details
          |> Map.get("content", [])
          |> normalize_entries(provider)
        end)
        |> sort_entries_by_date()

      case entries do
        [] ->
          :error

        _ ->
          {:ok,
           %{
             platform_name: "#{currency_code} INVESTMENTS",
             platform_path: "/provider/" <> String.downcase(currency_code),
             currency_code: currency_code,
             entries: entries,
             aggregate?: true,
             providers: Enum.map(platforms, fn {provider, _details} -> provider end)
           }}
      end
    else
      _ -> :error
    end
  end

  defp platform_entries(platform_name) do
    with {:ok, %{"content" => content} = platform_data} <-
           PortfolioData.platform(platform_name) do
      currency_code = Map.fetch!(platform_data, "currencyCode")
      entries = normalize_entries(content, platform_name)
      {:ok, {currency_code, entries}}
    else
      _ -> :error
    end
  end

  defp normalize_entries(content, provider_name) do
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

  defp sort_entries_by_date(entries) do
    Enum.sort_by(entries, fn entry -> {Date.to_erl(entry.date_obj), entry.provider} end)
  end

  defp build_points(entries) do
    points =
      entries
      |> Enum.map_reduce(0.0, fn entry, running_total ->
        portfolio_value = running_total + entry.amount
        {Map.put(entry, :portfolio_value, portfolio_value), portfolio_value}
      end)
      |> elem(0)

    case points do
      [] ->
        []

      [first | _] ->
        [
          first
          |> Map.put(:amount, 0.0)
          |> Map.put(:portfolio_value, 0.0)
          |> Map.put(:synthetic_start?, true)
          | points
        ]
    end
  end

  defp chart_payload([], _year_end_entries) do
    %{
      width: @chart_width,
      height: @chart_height,
      line_path: "",
      compound_line_path: "",
      area_path: "",
      y_ticks: [],
      x_labels: [],
      points: [],
      compound_points: []
    }
  end

  defp chart_payload(points, year_end_entries) do
    width = @chart_width
    height = @chart_height
    left = @chart_left
    right = @chart_right
    top = @chart_top
    bottom = @chart_bottom
    plot_width = width - left - right
    plot_height = height - top - bottom

    values = Enum.map(points, & &1.portfolio_value) ++ Enum.map(year_end_entries, & &1.amount)
    max_value = Enum.max(values)
    value_floor = 0.0
    value_ceil = max(max_value * 1.08, 1.0)

    step_x =
      case length(points) do
        count when count <= 1 -> 0.0
        count -> plot_width / (count - 1)
      end

    projected_points =
      points
      |> Enum.with_index()
      |> Enum.map(fn {point, index} ->
        x = left + step_x * index
        y = project_y(point.portfolio_value, value_floor, value_ceil, top, plot_height)

        Map.merge(point, %{
          x: x,
          y: y,
          display_date: format_date(point.date)
        })
      end)

    timeline_dates =
      Enum.map(points, & &1.date_obj) ++ Enum.map(year_end_entries, & &1.date_obj)

    first_date = Enum.min(timeline_dates, Date)
    last_date = Enum.max(timeline_dates, Date)

    projected_compound_points =
      year_end_entries
      |> Enum.sort_by(& &1.date_obj, Date)
      |> Enum.map(fn entry ->
        x = project_x(entry.date_obj, first_date, last_date, left, plot_width)
        y = project_y(entry.amount, value_floor, value_ceil, top, plot_height)

        %{
          x: x,
          y: y,
          amount: entry.amount
        }
      end)

    projected_compound_points =
      case projected_compound_points do
        [] ->
          []

        points_with_data ->
          [
            %{
              x: left,
              y: project_y(0.0, value_floor, value_ceil, top, plot_height),
              amount: 0.0
            }
            | points_with_data
          ]
      end

    y_ticks =
      0..4
      |> Enum.map(fn tick ->
        ratio = tick / 4
        value = value_floor + (value_ceil - value_floor) * (1 - ratio)
        y = top + plot_height * ratio
        %{y: y, value: value}
      end)

    x_labels =
      projected_points
      |> Enum.reject(&Map.get(&1, :synthetic_start?, false))
      |> sampled_points(6)
      |> Enum.map(fn point -> %{x: point.x, label: point.display_date} end)

    line_path =
      projected_points
      |> Enum.map(&svg_point(&1.x, &1.y))
      |> svg_line_path()

    compound_line_path =
      projected_compound_points
      |> Enum.map(&svg_point(&1.x, &1.y))
      |> svg_line_path()

    baseline = top + plot_height

    area_path =
      case projected_points do
        [] ->
          ""

        [first | _] = series ->
          line_part =
            series
            |> Enum.map(&svg_point(&1.x, &1.y))
            |> Enum.join(" L ")

          last = List.last(series)

          "M #{svg_float(first.x)} #{svg_float(baseline)} L " <>
            line_part <>
            " L #{svg_float(last.x)} #{svg_float(baseline)} Z"
      end

    %{
      width: width,
      height: height,
      line_path: line_path,
      compound_line_path: compound_line_path,
      area_path: area_path,
      y_ticks: y_ticks,
      x_labels: x_labels,
      points: projected_points,
      compound_points: projected_compound_points
    }
  end

  defp stats(points, all_entries) do
    contribution_points = non_synthetic_points(points)

    total_contributed =
      contribution_points
      |> Enum.reduce(0.0, fn point, acc -> acc + point.amount end)

    latest_contribution_value = latest_contribution_value(points)

    %{
      total_contributed: total_contributed,
      latest_value: latest_total_value(all_entries, latest_contribution_value),
      records: length(contribution_points),
      year_end_marks: Enum.count(all_entries, & &1.year_end?),
      providers: all_entries |> Enum.map(& &1.provider) |> Enum.uniq() |> length()
    }
  end

  defp latest_contribution_value(points) do
    case List.last(points) do
      nil -> 0.0
      point -> point.portfolio_value
    end
  end

  defp latest_total_value(entries, fallback_value) do
    latest_values =
      entries
      |> Enum.group_by(& &1.provider)
      |> Enum.map(fn {_provider, provider_entries} ->
        latest_year_end_value(provider_entries) || sum_contributions(provider_entries)
      end)

    case latest_values do
      [] -> fallback_value
      values -> Enum.sum(values)
    end
  end

  defp latest_year_end_value(entries) do
    entries
    |> Enum.filter(& &1.year_end?)
    |> Enum.sort_by(& &1.date_obj, Date)
    |> List.last()
    |> case do
      nil -> nil
      entry -> entry.amount
    end
  end

  defp sum_contributions(entries) do
    entries
    |> Enum.reject(& &1.year_end?)
    |> Enum.reduce(0.0, fn entry, acc -> acc + entry.amount end)
  end

  defp available_years(entries) do
    entries
    |> Enum.map(& &1.date_obj.year)
    |> Enum.uniq()
    |> Enum.sort(:desc)
  end

  defp year_options(years) do
    [{"All Years", "ALL"}] ++
      Enum.map(years, fn year -> {Integer.to_string(year), Integer.to_string(year)} end)
  end

  defp selected_filters(params) do
    selected_time_range = params["time_range"] || "ALL"
    selected_year = params["year"] || "ALL"
    selected_history_order = params["history_order"] || "newest"

    normalized_time_range =
      if selected_time_range in @time_ranges, do: selected_time_range, else: "ALL"

    normalized_history_order =
      if selected_history_order in Enum.map(@history_orders, &elem(&1, 1)) do
        selected_history_order
      else
        "newest"
      end

    {normalized_time_range, selected_year, normalized_history_order}
  end

  defp filter_by_period(entries, _time_range, year) when year != "ALL" do
    case Integer.parse(year) do
      {year_int, ""} -> Enum.filter(entries, fn entry -> entry.date_obj.year == year_int end)
      _ -> entries
    end
  end

  defp filter_by_period(entries, "ALL", "ALL"), do: entries

  defp filter_by_period(entries, time_range, "ALL") do
    start_date = filter_start_date(time_range)

    Enum.filter(entries, fn entry -> Date.compare(entry.date_obj, start_date) in [:eq, :gt] end)
  end

  defp filter_start_date(time_range) do
    reference_date = Date.utc_today()

    case time_range do
      "1M" -> Date.add(reference_date, -30)
      "3M" -> Date.add(reference_date, -90)
      "6M" -> Date.add(reference_date, -180)
      "YTD" -> Date.new!(reference_date.year, 1, 1)
      "12M" -> Date.add(reference_date, -365)
    end
  end

  defp project_y(value, floor, ceil, top, plot_height) do
    ratio = if ceil == floor, do: 0.5, else: (value - floor) / (ceil - floor)
    top + plot_height * (1 - ratio)
  end

  defp project_x(date, first_date, last_date, left, plot_width) do
    span_days = max(Date.diff(last_date, first_date), 1)
    distance = Date.diff(date, first_date)
    raw_x = left + plot_width * distance / span_days

    raw_x
    |> max(left)
    |> min(left + plot_width)
  end

  defp sampled_points([], _count), do: []

  defp sampled_points(points, count) do
    max_index = length(points) - 1

    if max_index <= 0 do
      points
    else
      0..(count - 1)
      |> Enum.map(fn i -> round(i * max_index / (count - 1)) end)
      |> Enum.uniq()
      |> Enum.map(fn index -> Enum.at(points, index) end)
    end
  end

  defp svg_line_path([]), do: ""

  defp svg_line_path([head | tail]) do
    "M #{head}" <> Enum.map_join(tail, "", &" L #{&1}")
  end

  defp svg_point(x, y), do: "#{svg_float(x)} #{svg_float(y)}"

  defp format_date(date) do
    with {:ok, parsed_date} <- Date.from_iso8601(date) do
      Calendar.strftime(parsed_date, "%b %Y")
    else
      _ -> date
    end
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

  defp svg_float(value) when is_float(value), do: :erlang.float_to_binary(value, decimals: 2)
  defp svg_float(value) when is_integer(value), do: Integer.to_string(value)

  defp split_entries(entries) do
    {Enum.reject(entries, & &1.year_end?), Enum.filter(entries, & &1.year_end?)}
  end

  defp provider_breakdown(_entries, _providers, false), do: []

  defp provider_breakdown(entries, providers, true) do
    totals_by_provider =
      Enum.reduce(entries, %{}, fn entry, totals ->
        Map.update(totals, entry.provider, entry.amount, &(&1 + entry.amount))
      end)

    max_total =
      totals_by_provider
      |> Map.values()
      |> Enum.max(fn -> 0.0 end)

    providers
    |> Enum.map(fn provider ->
      total = Map.get(totals_by_provider, provider, 0.0)
      percentage = if max_total > 0, do: total / max_total * 100, else: 0.0

      %{
        provider: provider,
        total: total,
        percentage: percentage
      }
    end)
    |> Enum.sort_by(fn breakdown -> {-breakdown.total, breakdown.provider} end)
  end

  defp history_rows(points, "oldest"), do: non_synthetic_points(points)

  defp history_rows(points, _history_order) do
    points
    |> non_synthetic_points()
    |> Enum.reverse()
  end

  defp non_synthetic_points(points) do
    Enum.reject(points, &Map.get(&1, :synthetic_start?, false))
  end
end
