import pytest

from lib.generation_queue_client import (
    TaskWaitTimeoutError,
    WorkerOfflineError,
    wait_for_task,
)


class TestGenerationQueueClient:
    def test_wait_for_task_timeout(self, generation_queue):
        task = generation_queue.enqueue_task(
            project_name="demo",
            task_type="storyboard",
            media_type="image",
            resource_id="S01",
            payload={"prompt": "p"},
            script_file="episode_01.json",
            source="skill",
        )

        with pytest.raises(TaskWaitTimeoutError):
            wait_for_task(
                task["task_id"],
                poll_interval=0.05,
                timeout_seconds=0.2,
                worker_offline_grace_seconds=10.0,
            )

    def test_wait_for_task_raises_when_worker_offline(self, generation_queue):
        task = generation_queue.enqueue_task(
            project_name="demo",
            task_type="storyboard",
            media_type="image",
            resource_id="S02",
            payload={"prompt": "p"},
            script_file="episode_01.json",
            source="skill",
        )

        with pytest.raises(WorkerOfflineError):
            wait_for_task(
                task["task_id"],
                poll_interval=0.05,
                timeout_seconds=5.0,
                worker_offline_grace_seconds=0.2,
            )
