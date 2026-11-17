require "test_helper"

class SettingsControllerTest < ActionDispatch::IntegrationTest
  test "settings require authentication" do
    get edit_settings_path

    assert_redirected_to new_session_path
  end

  test "update changes the profile and leaves a blank password alone" do
    sign_in_as users(:alice)
    digest = users(:alice).password_digest

    patch settings_path, params: {
      user: { username: "alice", email_address: "alice@example.com", bio: "Updated bio", image: "", password: "" }
    }

    assert_redirected_to edit_settings_path
    users(:alice).reload
    assert_equal "Updated bio", users(:alice).bio
    assert_equal digest, users(:alice).password_digest
  end

  test "update rejects an invalid username" do
    sign_in_as users(:alice)

    patch settings_path, params: {
      user: { username: "not valid", email_address: "alice@example.com", bio: "", image: "", password: "" }
    }

    assert_response :unprocessable_entity
    assert_equal "alice", users(:alice).reload.username
  end
end
