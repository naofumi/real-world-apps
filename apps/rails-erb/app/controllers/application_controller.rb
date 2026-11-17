class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  def current_ability
    @current_ability ||= Ability.new(Current.user)
  end

  private
    def page_of(scope)
      Page.new(scope, number: params[:page])
    end

    def authorize_or_redirect(action, subject, to:, alert:, **redirect_options)
      return true if can?(action, subject)

      redirect_to to, alert: alert, **redirect_options
      false
    end
end
