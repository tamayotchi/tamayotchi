defmodule Tamayotchi.Project do
  @moduledoc """
  Project metadata parsed from markdown files.
  """

  @enforce_keys [:id, :title, :period]
  defstruct [:id, :title, :period, :image, :url, :body]

  @type t :: %__MODULE__{
          id: binary(),
          title: binary(),
          period: binary(),
          image: binary() | nil,
          url: binary() | nil,
          body: binary()
        }

  @spec build(binary(), map(), binary()) :: t()
  def build(filename, attrs, body) do
    attrs
    |> Map.put(:id, project_id(filename))
    |> Map.put(:body, body)
    |> Map.put_new(:image, nil)
    |> Map.put_new(:url, nil)
    |> then(&struct!(__MODULE__, &1))
  end

  defp project_id(filename) do
    slug =
      filename
      |> Path.basename(".md")
      |> String.replace(~r/^\d+-/, "")

    "project-" <> slug
  end
end
