require "application_system_test_case"

class ArticlesTest < ApplicationSystemTestCase
  test "publishing, editing, and deleting an article" do
    sign_in users(:alice)
    click_link "New Article"
    fill_in "Title", with: "Markdown post"
    fill_in "Description", with: "About markdown"
    fill_in "Body", with: "Hello **world**\n\n<script>alert(1)</script>"
    fill_in "Tags", with: "rails, testing"
    click_button "Publish Article"

    assert_selector ".article-content strong", text: "world"
    assert_no_selector ".article-content script"
    assert_text "rails"
    assert_text "testing"

    click_link "Edit Article", match: :first
    fill_in "Title", with: "Markdown post revised"
    click_button "Publish Article"

    assert_text "Markdown post revised"
    assert_current_path article_path("markdown-post-revised")

    accept_confirm do
      click_button "Delete Article", match: :first
    end

    assert_text "Article deleted"
    assert_no_text "Markdown post revised"
  end

  test "filtering by tag and paging the feed" do
    10.times do |i|
      users(:alice).articles.create!(title: "Fresh #{i}", description: "About", body: "Body", created_at: (10 - i).minutes.from_now)
    end

    visit root_path
    click_link "2"
    assert_selector ".page-item.active", text: "2"
    assert_text "Alice on Rails"

    visit root_path
    click_link "dragons"
    assert_text "Training Dragons"
    assert_no_text "Alice on Rails"
  end
end
