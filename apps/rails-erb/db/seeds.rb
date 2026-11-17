alice = User.create!(
  username: "alice",
  email_address: "alice@example.com",
  password: "password",
  bio: "I write about Rails."
)
bob = User.create!(
  username: "bob",
  email_address: "bob@example.com",
  password: "password",
  bio: "Dragons, mostly.",
  image: "https://i.pravatar.cc/150?u=bob"
)
cara = User.create!(
  username: "cara",
  email_address: "cara@example.com",
  password: "password",
  bio: "Notes from the editor."
)

alice.follow(bob)
bob.follow(cara)
cara.follow(alice)

posts = [
  [ alice, "A vanilla Rails stack", "Server-rendered pages, cookie sessions, and almost no extra gems.", "Rails already includes the pieces this blog needs.\n\n- Hotwire for the few spots that benefit from it\n- SQLite for the database\n- **Commonmarker** for article text", "rails, hotwire" ],
  [ bob, "How to train your dragon", "Ever wonder how?", "You have to believe.\n\nDragons respond to patience, meat, and a calm voice.", "dragons, training" ],
  [ cara, "Editing is a second draft", "What to cut before you publish.", "Leave the explanation that the reader can infer.", "writing" ],
  [ alice, "Pagination without a gem", "Ten articles per page is enough.", "Offset and limit cover a blog feed. A page object keeps the arithmetic out of the template.", "rails" ],
  [ bob, "Favorite buttons", "A heart, a count, and a join table.", "Favoriting is a create and a destroy. The count lives on the article.", "rails, dragons" ],
  [ cara, "Comments stay plain text", "Markdown is for the article.", "Comments are short. Escaping them is the whole security story.", "writing" ],
  [ alice, "Following people", "Your feed is the articles of people you follow.", "You cannot follow yourself. The button is hidden on your own profile.", "rails, hotwire" ],
  [ bob, "Slugs follow the title", "Rename the article and the URL changes.", "Duplicate titles get a numeric suffix. The old address 404s.", "rails" ],
  [ cara, "A smiley for a missing face", "Profile images are URLs.", "An empty image shows the default avatar.", "writing" ],
  [ alice, "Password reset is built in", "Rails 8 already sends the email.", "Settings can change the password too. A blank password field leaves the current one alone.", "rails" ],
  [ bob, "Global feed", "Newest articles first.", "Tag filters narrow the same list.", "dragons" ],
  [ cara, "One more for page two", "This is here so the home page paginates.", "Page size is 10.", "writing" ]
]

posts.each_with_index do |(author, title, description, body, tags), index|
  article = author.articles.create!(title:, description:, body:, tag_list: tags)
  article.update_columns(created_at: index.days.ago, updated_at: index.days.ago)
end

dragon = Article.find_by!(slug: "how-to-train-your-dragon")
dragon.comments.create!(user: alice, body: "His name was my name too.")
dragon.comments.create!(user: cara, body: "Patience, then meat.")
alice.favorites.create!(article: dragon)
bob.favorites.create!(article: Article.find_by!(slug: "a-vanilla-rails-stack"))
