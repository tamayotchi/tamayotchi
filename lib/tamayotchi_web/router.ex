defmodule TamayotchiWeb.Router do
  use TamayotchiWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {TamayotchiWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", TamayotchiWeb do
    pipe_through :browser

    get "/", PageController, :index
    get "/salary", SalaryController, :index
    get "/provider/:provider", ProviderController, :show
    get "/up", HealthController, :show
    get "/posts", BlogController, :index
    get "/posts/:id", BlogController, :show
  end

  # Other scopes may use custom stacks.
  # scope "/api", TamayotchiWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard in development
  if Application.compile_env(:tamayotchi, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: TamayotchiWeb.Telemetry
    end
  end

  scope "/", TamayotchiWeb do
    pipe_through :browser

    get "/*path", SpaController, :index
  end
end
