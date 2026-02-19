defmodule TamayotchiWeb.PageController do
  use TamayotchiWeb, :controller

  @portfolio_data_path Path.expand("../../../tamayotchi/src/data/data.json", __DIR__)

  def index(conn, _params) do
    %{
      usd_contributions: usd_contributions,
      cop_contributions: cop_contributions,
      platforms: platforms
    } =
      portfolio_summary()

    exchange_rate = fetch_exchange_rate()
    last_update = fetch_last_update()

    totals =
      case exchange_rate do
        rate when is_number(rate) and rate > 0 ->
          %{
            usd: usd_contributions + cop_contributions / rate,
            cop: cop_contributions + usd_contributions * rate
          }

        _ ->
          %{usd: usd_contributions, cop: cop_contributions}
      end

    render(conn, :index,
      last_update: last_update,
      exchange_rate: exchange_rate,
      totals: totals,
      platforms: platforms
    )
  end

  defp portfolio_summary do
    with {:ok, json} <- File.read(@portfolio_data_path),
         {:ok, data} <- Jason.decode(json) do
      platforms =
        data
        |> Enum.map(fn {provider, details} ->
          %{
            name: provider,
            path: String.downcase(provider),
            currency_code: Map.get(details, "currencyCode", "USD")
          }
        end)

      {usd_contributions, cop_contributions} =
        Enum.reduce(data, {0.0, 0.0}, fn {_provider, details}, {usd_acc, cop_acc} ->
          currency_code = Map.get(details, "currencyCode", "USD")
          amount = sum_contributions(Map.get(details, "content", []))

          case currency_code do
            "USD" -> {usd_acc + amount, cop_acc}
            "COP" -> {usd_acc, cop_acc + amount}
            _ -> {usd_acc, cop_acc}
          end
        end)

      %{
        usd_contributions: usd_contributions,
        cop_contributions: cop_contributions,
        platforms: Enum.sort_by(platforms, & &1.name)
      }
    else
      _ ->
        %{usd_contributions: 0.0, cop_contributions: 0.0, platforms: []}
    end
  end

  defp sum_contributions(content) do
    content
    |> Enum.reject(&Map.get(&1, "isYearEndValue", false))
    |> Enum.reduce(0.0, fn entry, acc ->
      case Map.get(entry, "amount") do
        amount when is_integer(amount) -> acc + amount
        amount when is_float(amount) -> acc + amount
        _ -> acc
      end
    end)
  end

  defp fetch_exchange_rate do
    with true <- fetch_remote_home_data?(),
         {:ok, %{status: 200, body: %{"rates" => %{"COP" => rate}}}} when is_number(rate) <-
           Req.get("https://api.exchangerate-api.com/v4/latest/USD") do
      rate
    else
      _ -> nil
    end
  end

  defp fetch_last_update do
    url = "https://api.github.com/repos/Juantamayo26/tamayotchi/commits?per_page=1"

    with true <- fetch_remote_home_data?(),
         {:ok, %{status: 200, body: [%{"commit" => %{"committer" => %{"date" => date}}} | _]}} <-
           Req.get(url) do
      format_commit_date(date)
    else
      _ -> "Unavailable"
    end
  end

  defp fetch_remote_home_data? do
    Application.get_env(:tamayotchi, :fetch_remote_home_data, true)
  end

  defp format_commit_date(date) do
    with {:ok, datetime, _offset} <- DateTime.from_iso8601(date) do
      Calendar.strftime(datetime, "%Y-%m-%d %I:%M %p UTC")
    else
      _ -> "Unavailable"
    end
  end
end
