defmodule Tamayotchi.Blog do
  alias Tamayotchi.Blog.Post

  for app <- [:earmark, :makeup_elixir] do
    Application.ensure_all_started(app)
  end

  use NimblePublisher,
    build: Post,
    from: Application.app_dir(:tamayotchi, "priv/posts/**/*.md"),
    as: :posts,
    highlighters: [:makeup_elixir]

  # The @posts variable is first defined by NimblePublisher.
  # Let's further modify it by sorting all posts by descending date.
  @posts Enum.sort_by(@posts, & &1.date, {:desc, Date})

  # And finally export them
  def all_posts, do: @posts

  def recent_posts, do: Enum.take(all_posts(), 3)

  defmodule NotFoundError, do: defexception([:message, plug_status: 404])

  def find_by_id(id) do
    Enum.find(all_posts(), fn post -> post.id == id end)
  end
end
