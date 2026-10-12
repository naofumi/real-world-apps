class Tag < ApplicationRecord
  has_many :taggings, dependent: :destroy
  has_many :articles, through: :taggings

  validates :name, presence: true, uniqueness: true

  normalizes :name, with: ->(name) { name.strip.downcase }

  scope :popular, -> {
    joins(:taggings).group(:id).order(Arel.sql("COUNT(taggings.id) DESC"), :name)
  }
end
