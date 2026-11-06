require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "health endpoint reports service status" do
    get "/health"

    assert_response :success
    assert_equal "ok", response.parsed_body.fetch("status")
    assert_equal "vatvit-community-rails", response.parsed_body.fetch("service")
  end

  test "community endpoint reports that features are not deployed" do
    get "/v1/community/status"

    assert_response :success
    assert_equal "in_development", response.parsed_body.fetch("status")
  end
end
