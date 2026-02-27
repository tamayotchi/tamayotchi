defmodule TamayotchiWeb.Formatters do
  @moduledoc false

  def format_number(value, decimals) when is_number(value) and is_integer(decimals) do
    value
    |> to_float()
    |> :erlang.float_to_binary(decimals: decimals)
    |> add_delimiters()
  end

  def format_number(_value, _decimals), do: "0"

  def format_currency(value, decimals, currency_code)
      when is_number(value) and is_integer(decimals) and is_binary(currency_code) do
    format_number(value, decimals) <> " " <> currency_code
  end

  def format_currency(_value, _decimals, currency_code), do: "0 " <> currency_code

  defp to_float(value) when is_integer(value), do: value * 1.0
  defp to_float(value) when is_float(value), do: value

  defp add_delimiters(number_string) do
    [whole | decimal] = String.split(number_string, ".", parts: 2)

    whole_with_commas =
      whole
      |> String.reverse()
      |> String.replace(~r/(\d{3})(?=\d)/, "\\1,")
      |> String.reverse()

    case decimal do
      [decimal_part] -> whole_with_commas <> "." <> decimal_part
      _ -> whole_with_commas
    end
  end
end
