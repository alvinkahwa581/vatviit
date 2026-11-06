class CommunityStatusController < ApplicationController
  def show
    render json: { status: "in_development", service: "vatvit-community" }
  end
end
