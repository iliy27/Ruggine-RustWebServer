use std::fs::{OpenOptions};
use std::io::Write;
use std::thread;
use std::time::Duration;
use sysinfo::{System, SystemExt, ProcessExt};

pub fn start_monitoring() {
    thread::spawn(|| {
        let mut system = System::new_all();

        // Open or create the logfile
        let log_file_path = "src/utilities/logfile";
        let mut log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_file_path)
            .expect("Failed to open or create logfile");

        let pid = sysinfo::get_current_pid().expect("Failed to get current PID");

        loop {
            // Refresh system information
            system.refresh_all();

            if let Some(process) = system.process(pid) {
                let cpu_usage = process.cpu_usage();
                let log_message = format!("Server CPU Usage: {:.2}%\n", cpu_usage);
                
                print!("{}", log_message);

                // Write the log on file
                if let Err(e) = log_file.write_all(log_message.as_bytes()) {
                    eprintln!("Failed to write to logfile: {}", e);
                }
            } else {
                eprintln!("Process not found!");
            }

            // Sleep for 2 minutes
            thread::sleep(Duration::from_secs(120));
        }
    });
}