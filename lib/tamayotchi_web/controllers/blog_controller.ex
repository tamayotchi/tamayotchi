defmodule TamayotchiWeb.BlogController do
  use TamayotchiWeb, :controller

  def index(conn, _params) do
    posts = Tamayotchi.Blog.all_posts()
    render(conn, :index, posts: posts)
  end

  def show(conn, params) do
    if post = Tamayotchi.Blog.find_by_id(params["id"]) do
      render(conn, :show, post: post)
    else
      conn
      |> put_status(404)
      |> put_view(html: TamayotchiWeb.ErrorHTML)
      |> render("404.html")
    end
  end
end
