Rails.application.routes.draw do
  resource :session
  resources :passwords, param: :token
  resource :registration, only: %i[ new create ]
  resource :settings, only: %i[ edit update ]
  resource :feed, only: :show

  resources :articles do
    resources :comments, only: %i[ create destroy ]
    resource :favorite, only: %i[ create destroy ], module: :articles
  end

  resources :users, only: :show do
    resource :follow, only: %i[ create destroy ], module: :users
    resources :favorites, only: :index, module: :users
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "articles#index"
end
