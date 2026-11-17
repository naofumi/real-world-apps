class SettingsController < ApplicationController
  def edit
  end

  def update
    if Current.user.update(settings_params)
      redirect_to edit_settings_path, notice: "Settings updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private
    def settings_params
      permitted = params.expect(user: [ :email_address, :username, :password, :bio, :image ])
      permitted.delete(:password) if permitted[:password].blank?
      permitted
    end
end
