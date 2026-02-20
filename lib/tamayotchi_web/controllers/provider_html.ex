defmodule TamayotchiWeb.ProviderHTML do
  use TamayotchiWeb, :html

  embed_templates "provider_html/*"

  def format_currency(value, decimals, currency_code),
    do: TamayotchiWeb.Formatters.format_currency(value, decimals, currency_code)

  def format_history_date(date) when is_binary(date) do
    with {:ok, parsed_date} <- Date.from_iso8601(date) do
      Calendar.strftime(parsed_date, "%B %-d, %Y")
    else
      _ -> date
    end
  end

  def format_history_date(_date), do: "-"
end
