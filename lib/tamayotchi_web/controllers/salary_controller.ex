defmodule TamayotchiWeb.SalaryController do
  use TamayotchiWeb, :controller

  @seconds_per_month 30 * 24 * 60 * 60

  def index(conn, _params) do
    exchange_rate = fetch_exchange_rate()
    monthly_salary_cop = monthly_salary_cop()

    salary = %{
      monthly_cop: monthly_salary_cop,
      monthly_usd: monthly_usd(monthly_salary_cop, exchange_rate),
      per_second: monthly_salary_cop / @seconds_per_month,
      per_minute: monthly_salary_cop / @seconds_per_month * 60,
      per_hour: monthly_salary_cop / @seconds_per_month * 3_600,
      per_day: monthly_salary_cop / @seconds_per_month * 86_400
    }

    render(conn, :index, salary: salary, exchange_rate: exchange_rate)
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

  defp fetch_remote_home_data? do
    Application.get_env(:tamayotchi, :fetch_remote_home_data, true)
  end

  defp monthly_salary_cop do
    Application.fetch_env!(:tamayotchi, :monthly_salary_cop)
  end

  defp monthly_usd(monthly_salary_cop, rate) when is_number(rate) and rate > 0,
    do: monthly_salary_cop / rate

  defp monthly_usd(_monthly_salary_cop, _rate), do: nil
end
