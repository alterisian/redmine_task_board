class TaskBoardsController < ApplicationController
  unloadable
  menu_item :task_board
  
  before_filter :find_version_and_project, :authorize, :only => [:show]
  
  def show
    @statuses = IssueStatus.all(:order => "position asc")
    @limits = TaskboardLimit.all(:conditions => {:project_id => @project.id} ).group_by(&:status_id)

    fixed_issues = @version.fixed_issues
    @stories_with_tasks = (Issue.instance_methods.include?("story")) ? fixed_issues.group_by(&:story) : { nil => fixed_issues }
    
    if @stories_with_tasks[nil]
      @stories_with_tasks[nil] = @stories_with_tasks[nil].reject {|issue| @stories_with_tasks.keys.include?(issue) }
    end
    
    @stories_with_tasks.each do |story, tasks|
      @stories_with_tasks[story] = tasks.group_by(&:status)
    end
  end
  
  def update_issue_status
    @status = IssueStatus.find(params[:status_id])
    
    @issue = Issue.find(params[:id])
    @old_status = @issue.status

    project = @issue.project
    all_issues = project.current_version.fixed_issues
    @limit = TaskboardLimit.first(:conditions => { :status_id => @status.id, :project_id => project.id } )
    target_status_count = all_issues.count(:conditions => { :status_id => @status.id} )

    update_forbidden = @limit && @limit.limit > 0 && target_status_count + 1 > @limit.limit
    unless update_forbidden
    @issue.init_journal(User.current, "Automated status change from the Task Board")

    attrs = {:status_id => @status.id}
    attrs.merge!(:assigned_to_id => User.current.id) unless @issue.assigned_to_id?
    @issue.update_attributes(attrs)
    
      @old_status_count = all_issues.count(:conditions => { :status_id => @old_status.id } )
      @new_status_count = target_status_count + 1
    end

    render :update do |page|
      page.remove dom_id(@issue)
      story = @issue.story if @issue.respond_to?(:story)
      page.insert_html :bottom,
        task_board_dom_id(story, update_forbidden ? @old_status : @status, "list"),
        :partial => "issue", :object => @issue
      unless update_forbidden
        page.replace_html task_board_dom_id(story, @old_status, "count"), @old_status_count
        page.replace_html task_board_dom_id(story, @status, "count"), @new_status_count
      end
    end
  end
  
private
  def find_version_and_project
    @project = Project.find(params[:id])
    @version = @project.current_version
    render_error(l(:task_board_text_no_sprint)) and return unless @version
  end
end
