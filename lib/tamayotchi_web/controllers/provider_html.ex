defmodule TamayotchiWeb.ProviderHTML do
  use TamayotchiWeb, :html

  embed_templates "provider_html/*"

  def format_currency(value, decimals, currency_code),
    do: TamayotchiWeb.Formatters.format_currency(value, decimals, currency_code)

  def format_signed_currency(nil, _decimals, _currency_code), do: "N/A"

  def format_signed_currency(value, decimals, currency_code) when is_number(value) do
    sign = if value > 0, do: "+", else: ""
    sign <> format_currency(value, decimals, currency_code)
  end

  def format_growth_percentage(nil), do: "N/A"

  def format_growth_percentage(value) when is_number(value) do
    sign = if value > 0, do: "+", else: ""
    sign <> TamayotchiWeb.Formatters.format_number(value, 2) <> "%"
  end

  def growth_tone_class(nil), do: "provider-growth-neutral"
  def growth_tone_class(value) when value < 0, do: "provider-growth-negative"
  def growth_tone_class(0), do: "provider-growth-neutral"
  def growth_tone_class(_value), do: "provider-growth-positive"

  def format_history_date(date) when is_binary(date) do
    with {:ok, parsed_date} <- Date.from_iso8601(date) do
      Calendar.strftime(parsed_date, "%B %-d, %Y")
    else
      _ -> date
    end
  end

  def format_history_date(_date), do: "-"

  def active_filter_label(_time_range, year) when is_binary(year) and year != "ALL",
    do: "Year #{year}"

  def active_filter_label("ALL", "ALL"), do: "All Years"
  def active_filter_label("YTD", "ALL"), do: "Year to Date"
  def active_filter_label(time_range, "ALL"), do: "Last #{time_range}"

  def time_range_path(platform_path, range, history_order)
      when is_binary(platform_path) and is_binary(range) do
    filtered_provider_path(platform_path, range, "ALL", history_order)
  end

  def filtered_provider_path(platform_path, time_range, year, history_order)
      when is_binary(platform_path) and is_binary(time_range) do
    platform_path <>
      "?" <>
      URI.encode_query(%{time_range: time_range, year: year, history_order: history_order})
  end
end
