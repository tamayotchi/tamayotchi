defmodule TamayotchiWeb.PageController do
  use TamayotchiWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
