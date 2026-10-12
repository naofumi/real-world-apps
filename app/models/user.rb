class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  has_many :articles, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :favorite_articles, through: :favorites, source: :article

  has_many :follows, foreign_key: :follower_id, dependent: :destroy
  has_many :followed_users, through: :follows, source: :followed
  has_many :follower_relationships, class_name: "Follow", foreign_key: :followed_id, dependent: :destroy
  has_many :followers, through: :follower_relationships, source: :follower

  normalizes :email_address, with: ->(email) { email.strip.downcase }
  normalizes :username, with: ->(username) { username.strip }

  validates :email_address, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: { case_sensitive: false }, format: { with: /\A[A-Za-z0-9_]+\z/, message: "can only use letters, numbers, and underscores" }
  validates :image, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: "must be an http(s) URL" }, allow_blank: true

  def self.find_by_username!(username)
    find_by!("LOWER(username) = ?", username.to_s.downcase)
  end

  def to_param
    username
  end

  def follow(user)
    return if user.nil? || user == self

    follows.find_or_create_by!(followed: user)
  end

  def unfollow(user)
    follows.where(followed: user).destroy_all
  end

  def following?(user)
    return false if user.nil? || user == self

    follows.exists?(followed: user)
  end

  def favorited_among(articles)
    favorite_articles.where(id: articles.map(&:id))
  end
end
