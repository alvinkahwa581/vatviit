class HealthController < ApplicationController
  def show
    render json: { status: "ok", service: "vatvit-community-rails" }
  end
end
