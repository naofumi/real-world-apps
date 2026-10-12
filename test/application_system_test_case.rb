require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 1400 ]

  include ActiveJob::TestHelper

  Capybara.default_max_wait_time = 5

  def sign_in(user, password: "password")
    visit new_session_path
    fill_in "Email", with: user.email_address
    fill_in "Password", with: password
    click_button "Sign in"
    assert_selector "nav", text: user.username
  end
end
