require "test_helper"

class RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "create signs the new user in" do
    assert_difference -> { User.count }, 1 do
      post registration_path, params: { user: { username: "cara", email_address: "cara@example.com", password: "password" } }
    end

    assert_redirected_to root_path
    assert cookies[:session_id]
  end

  test "invalid registration renders the form" do
    assert_no_difference -> { User.count } do
      post registration_path, params: { user: { username: "", email_address: "not-an-email", password: "password" } }
    end

    assert_response :unprocessable_entity
  end
end
