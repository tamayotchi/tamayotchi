defmodule TamayotchiWeb.SpaController do
  use TamayotchiWeb, :controller

  def index(conn, _params) do
    index_file = Path.join(:code.priv_dir(:tamayotchi), "static/index.html")

    if File.exists?(index_file) do
      conn
      |> put_resp_content_type("text/html; charset=utf-8")
      |> send_file(200, index_file)
    else
      send_resp(conn, 404, "SPA assets not built. Run npm run build in tamayotchi/.")
    end
  end
end
