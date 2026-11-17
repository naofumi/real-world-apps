require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  test "show lists the user's articles" do
    get user_path(users(:alice))

    assert_response :success
    assert_select "h4", text: "alice"
    assert_select "h1", text: "Alice on Rails"
    assert_select "h1", text: "Training Dragons", count: 0
    assert_select ".nav-link.active", text: "My Articles"
    assert_select ".nav-link.active", text: "Favorited Articles", count: 0
  end

  test "missing users are not found" do
    get user_path("missing")

    assert_response :not_found
  end
end
