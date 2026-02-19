defmodule TamayotchiWeb.HealthController do
  use TamayotchiWeb, :controller

  def show(conn, _params) do
    text(conn, "OK")
  end
end
