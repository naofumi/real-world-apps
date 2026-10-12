class Page
  PER_PAGE = 10

  attr_reader :records, :number, :count

  def initialize(scope, number:)
    @number = [ number.to_i, 1 ].max
    @count = scope.unscope(:order).distinct.count(:id)
    @records = scope.offset((@number - 1) * PER_PAGE).limit(PER_PAGE)
  end

  def total_pages
    return 0 if count.zero?

    (count.to_f / PER_PAGE).ceil
  end
end
