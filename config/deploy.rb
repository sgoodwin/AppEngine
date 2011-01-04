set :application, "AppEngine"
set :repository,  "git://github.com/sgoodwin/AppEngine.git"
set :scm, :git
set :use_sudo, false
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`
set :deploy_to,   "~/#{application}"

role :web, "goodwinlabs"                          # Your HTTP server, Apache/etc
role :app, "goodwinlabs"                          # This may be the same as your `Web` server
role :db,  "goodwinlabs", :primary => true

namespace :deploy do
  task :start, :roles => :app do
    restart
  end

  task :stop, :roles => :app do
    run "/usr/bin/god stop node-god-appengine-instances"
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "/usr/bin/god stop node-god-appengine-instances"
    run "/usr/bin/god load #{File.join deploy_to, 'current', 'node.god'}"
    run "/usr/bin/god start node-god-appengine-instances"
  end
end