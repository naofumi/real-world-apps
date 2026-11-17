require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 1400 ] do |options|
    # Leave unexpected JavaScript dialogs (alert, confirm, prompt, beforeunload) in place
    # instead of failing the test when one appears.
    # https://github.com/makandra/capybara-lockstep#configuring-selenium-webdriver-recommended
    options.unhandled_prompt_behavior = :ignore

    # Don't offer to save sign-in details.
    options.add_preference("credentials_enable_service", false)
    # Don't autofill or manage saved passwords.
    options.add_preference("profile.password_manager_enabled", false)
    # Don't warn that a password such as "password" appeared in a breach.
    options.add_preference("profile.password_manager_leak_detection", false)
    # Turn off the leak warning, the password-manager intro, and the generated-password dropdown.
    options.add_argument("--disable-features=PasswordLeakDetection,PasswordManagerOnboarding,PasswordGeneration")
  end

  include ActiveJob::TestHelper

  Capybara.default_max_wait_time = 5
  # Also match locators against this attribute, so finders can target an element by data-testid as well as by id.
  Capybara.test_id = "data-testid"

  def sign_in(user, password: "password")
    visit new_session_path
    fill_in "Email", with: user.email_address
    fill_in "Password", with: password
    click_button "Sign in"
    assert_selector "nav", text: user.username
  end
end
