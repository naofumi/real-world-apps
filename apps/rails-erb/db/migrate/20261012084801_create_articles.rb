class CreateArticles < ActiveRecord::Migration[8.1]
  def change
    create_table :articles do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description, null: false
      t.text :body, null: false
      t.string :slug, null: false
      t.integer :favorites_count, null: false, default: 0

      t.timestamps
    end
    add_index :articles, :slug, unique: true
    add_index :articles, :created_at
  end
end
