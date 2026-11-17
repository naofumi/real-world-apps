require "application_system_test_case"

class AuthenticationTest < ApplicationSystemTestCase
  test "signing up and logging out" do
    visit new_registration_path
    fill_in "Username", with: "newbie"
    fill_in "Email", with: "newbie@example.com"
    fill_in "Password", with: "password"
    click_button "Sign up"

    assert_text "newbie"
    visit edit_settings_path
    click_button "Or click here to logout."

    assert_text "Sign in"
    sign_in User.find_by!(username: "newbie")
    assert_text "newbie"
  end

  test "resetting a password" do
    visit new_password_path
    fill_in "Email", with: users(:alice).email_address

    perform_enqueued_jobs do
      click_button "Email reset instructions"
    end

    assert_text "Password reset instructions sent"
    link = ActionMailer::Base.deliveries.last.body.encoded[%r{https?://\S+}]
    visit URI.parse(link).request_uri

    fill_in "New password", with: "new-password"
    fill_in "Confirm new password", with: "new-password"
    click_button "Reset password"

    assert_text "Password has been reset"
    sign_in users(:alice), password: "new-password"
    assert_text "alice"
  end
end
