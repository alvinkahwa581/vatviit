Rails.application.routes.draw do
  get "/health", to: "health#show"
  get "/v1/community/status", to: "community_status#show"
end
