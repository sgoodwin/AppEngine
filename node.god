app_root  = "/home/sgoodwin/AppEngine/current"

God.watch do |w|
  w.name     = "node-god-appengine-instances"
  w.group    = 'node-god'
  w.interval = 5.seconds

  w.start  = "env node #{app_root}/server.js"
  w.stop  = "env killall node"

  w.uid = ENV['USER']

  w.pid_file = File.join(app_root, "node-monitor.pid")
  w.behavior(:clean_pid_file)

  w.start_if do |start|
    start.condition(:process_running) do |c|
      c.interval = 5.seconds
      c.running = false
    end
  end

  w.restart_if do |restart|
    restart.condition(:memory_usage) do |c|
      c.above = 100.megabytes
      c.times = [3, 5] # 3 out of 5 intervals
    end

    restart.condition(:cpu_usage) do |c|
      c.above = 50.percent
      c.times = 5
    end
  end

  # lifecycle
  w.lifecycle do |on|
    on.condition(:flapping) do |c|
      c.to_state = [:start, :restart]
      c.times = 5
      c.within = 5.minute
      c.transition = :unmonitored
      c.retry_in = 10.minutes
      c.retry_times = 5
      c.retry_within = 2.hours
    end
  end

end