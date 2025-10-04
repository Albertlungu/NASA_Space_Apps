class CreateUserExposures < ActiveRecord::Migration[7.1]
  def change
    create_table :user_exposures do |t|
      t.references :user, null: false, foreign_key: true
      t.string :pollutant, null: false
      t.float :value, null: false
      t.integer :duration_minutes, default: 60
      t.float :latitude
      t.float :longitude
      t.datetime :recorded_at, null: false
      t.timestamps
    end

    add_index :user_exposures, :pollutant
    add_index :user_exposures, :recorded_at
  end
end
