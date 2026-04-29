import azure.functions as func
import logging
import os
from azure.mgmt.containerinstance import ContainerInstanceManagementClient
from azure.mgmt.containerinstance.models import ContainerGroup
from azure.identity import DefaultAzureCredential
from datetime import datetime, timezone, timedelta

app = func.FunctionApp()

# Run every hour instead of every 15 min — give the job time to finish
@app.timer_trigger(schedule="0 0 */1 * * *", arg_name="timer", run_on_startup=False)
def farm_sync_trigger(timer: func.TimerRequest) -> None:
    logging.info("Farm Sync Triggered.")

    SUBSCRIPTION_ID = "cbad53d0-c041-4e9c-8a64-6be4bcac5e8d"
    RESOURCE_GROUP  = "farm-sync-rg"
    CONTAINER_GROUP = "farm-sync-job"

    # How long we allow the job to run before we consider it "stale/stuck"
    MAX_JOB_DURATION_MINUTES = 50

    try:
        credential = DefaultAzureCredential()
        client = ContainerInstanceManagementClient(credential, SUBSCRIPTION_ID)

        container_group = client.container_groups.get(RESOURCE_GROUP, CONTAINER_GROUP)
        current_state   = container_group.instance_view.state
        logging.info(f"Container '{CONTAINER_GROUP}' current state: {current_state}")

        # Check if a container started recently and might still be working
        if current_state in ["Running", "Pending"]:
            # Check how long it's been running
            start_time = None
            if container_group.containers:
                events = container_group.containers[0].instance_view.events or []
                start_events = [e for e in events if e.name == "Started"]
                if start_events:
                    # Get the most recent start event
                    latest_start = max(start_events, key=lambda e: e.last_timestamp)
                    start_time = latest_start.last_timestamp

            if start_time:
                now = datetime.now(timezone.utc)
                # Make start_time timezone-aware if it isn't
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                running_for = (now - start_time).total_seconds() / 60

                if running_for < MAX_JOB_DURATION_MINUTES:
                    logging.warning(
                        f"Job has been running for {running_for:.1f} min "
                        f"(limit={MAX_JOB_DURATION_MINUTES} min). Skipping."
                    )
                    return
                else:
                    logging.warning(
                        f"Job has been running for {running_for:.1f} min — "
                        f"exceeds limit, restarting."
                    )
            else:
                logging.warning("Job is Running/Pending but no start time found. Skipping.")
                return

        # Safe to start
        logging.info(f"Starting '{CONTAINER_GROUP}'...")
        client.container_groups.begin_start(RESOURCE_GROUP, CONTAINER_GROUP)
        logging.info("Start command sent successfully.")

    except Exception as e:
        logging.error(f"Error managing container: {str(e)}", exc_info=True)