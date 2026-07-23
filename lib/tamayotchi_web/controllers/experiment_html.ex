defmodule TamayotchiWeb.ExperimentHTML do
  use TamayotchiWeb, :html

  embed_templates "experiment_html/*"

  def format_currency(value, decimals, currency_code),
    do: TamayotchiWeb.Formatters.format_currency(value, decimals, currency_code)

  def format_percentage(value) when is_number(value) do
    TamayotchiWeb.Formatters.format_number(value, 2) <> "%"
  end

  def format_percentage(_value), do: "0.00%"

  def input_number(value, decimals \\ 0)

  def input_number(value, 0) when is_number(value) do
    :erlang.float_to_binary(value, decimals: 0)
  end

  def input_number(value, decimals) when is_number(value) do
    value
    |> :erlang.float_to_binary(decimals: decimals)
    |> String.trim_trailing("0")
    |> String.trim_trailing(".")
  end

  def input_number(_value, _decimals), do: "0"
end
