defmodule TamayotchiWeb.SalaryHTML do
  use TamayotchiWeb, :html

  embed_templates "salary_html/*"

  def format_currency(value, decimals),
    do: TamayotchiWeb.Formatters.format_number(value, decimals)
end
