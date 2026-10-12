require "test_helper"

class FeedsControllerTest < ActionDispatch::IntegrationTest
  test "your feed requires authentication" do
    get feed_path

    assert_redirected_to new_session_path
  end

  test "show lists articles from followed users" do
    sign_in_as users(:alice)

    get feed_path

    assert_response :success
    assert_select ".nav-link.active", text: "Your Feed"
    assert_select "h1", text: "Training Dragons"
    assert_select "h1", text: "Alice on Rails", count: 0
  end
end
