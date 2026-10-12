module ApplicationHelper
  def avatar_tag(user, **options)
    image_tag(user.image.presence || "default-avatar.svg", alt: user.username, **options)
  end

  def render_markdown(text)
    html = Commonmarker.to_html(text.to_s, plugins: { syntax_highlighter: nil })
    sanitize(html)
  end

  def posted_on(time)
    time.strftime("%B #{time.day.ordinalize}")
  end
end
