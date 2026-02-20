defmodule TamayotchiWeb.PageHTML do
  use TamayotchiWeb, :html

  embed_templates "page_html/*"

  def format_currency(value, decimals),
    do: TamayotchiWeb.Formatters.format_number(value, decimals)
end
