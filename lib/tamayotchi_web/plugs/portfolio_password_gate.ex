defmodule TamayotchiWeb.Plugs.PortfolioPasswordGate do
  @moduledoc """
  Protects private portfolio-adjacent pages behind the shared portfolio unlock.

  The `/` homepage stays public and renders its own partial unlock UI. Salary and
  provider pages, however, contain detailed financial data, so this plug redirects
  locked sessions back to the homepage unlock card before the controller runs.
  """

  import Plug.Conn
  import Phoenix.Controller, only: [redirect: 2]

  alias TamayotchiWeb.PortfolioAccess

  def init(opts), do: opts

  def call(conn, _opts) do
    if PortfolioAccess.unlocked?(conn) do
      conn
    else
      conn
      |> PortfolioAccess.remember_return_to(
        Phoenix.Controller.current_path(conn, conn.query_params)
      )
      |> redirect(to: "/#portfolio-totals")
      |> halt()
    end
  end
end
