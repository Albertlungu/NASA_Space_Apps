class CreateAlerts < ActiveRecord::Migration[7.1]
  def change
    create_table :alerts do |t|
      t.references :user, foreign_key: true
      t.string :severity, null: false # low, moderate, high, severe
      t.string :pollutant
      t.integer :aqi
      t.float :latitude
      t.float :longitude
      t.text :message, null: false
      t.boolean :active, default: true
      t.datetime :expires_at
      t.timestamps
    end

    add_index :alerts, :severity
    add_index :alerts, :active
    add_index :alerts, [:latitude, :longitude]
  end
end
