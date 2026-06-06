defmodule Tamayotchi.Projects do
  @moduledoc """
  Loads homepage projects from markdown with NimblePublisher.

  Each project lives in its own markdown file under `priv/projects/` with an
  Elixir map frontmatter payload, followed by `---` and an optional markdown body.
  Filenames are sorted, so numeric prefixes control homepage order.
  """

  alias Tamayotchi.Project

  use NimblePublisher,
    build: Project,
    from: Application.app_dir(:tamayotchi, "priv/projects/*.md"),
    as: :projects

  @spec all_projects() :: [Project.t()]
  def all_projects, do: Enum.reverse(@projects)
end
