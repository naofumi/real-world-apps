require "application_system_test_case"

class SocialTest < ApplicationSystemTestCase
  test "commenting on an article" do
    sign_in users(:bob)
    visit article_path(articles(:alices))
    fill_in "Comment", with: "A plain comment"
    click_button "Post Comment"

    assert_text "A plain comment"
    assert_no_button "Delete comment"

    sign_in users(:alice)
    visit article_path(articles(:bobs))
    click_button "Delete comment"

    assert_no_text "His name was my name too."
  end

  test "favoriting, following, and reading your feed" do
    sign_in users(:bob)
    visit root_path
    find("button[aria-label='Favorite Alice on Rails']").click
    assert_selector "button[aria-label='Unfavorite Alice on Rails']"

    visit user_path(users(:alice))
    assert_selector "img.user-img[src*='default-avatar']"
    click_button "Follow alice"
    assert_button "Unfollow alice"

    visit feed_path
    assert_text "Alice on Rails"
    assert_no_text "Training Dragons"
  end

  test "updating settings" do
    sign_in users(:alice)
    visit edit_settings_path
    fill_in "Bio", with: "Updated from the browser"
    fill_in "New password", with: "new-password"
    click_button "Update Settings"

    assert_text "Settings updated"
    click_button "Or click here to logout."
    sign_in users(:alice), password: "new-password"
    visit user_path(users(:alice))
    assert_text "Updated from the browser"
  end
end
