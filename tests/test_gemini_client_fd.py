from pathlib import Path
from types import SimpleNamespace

from PIL import Image

from lib.gemini_client import GeminiClient


class _FakeModels:
    def __init__(self):
        self.observed_fps = []

    def generate_content(self, model, contents):
        image_obj = contents[0]
        self.observed_fps.append(getattr(image_obj, "fp", None))
        return SimpleNamespace(text="cinematic, dramatic lighting")


class _FakeClient:
    def __init__(self):
        self.models = _FakeModels()


class TestGeminiClientFdSafety:
    def test_build_contents_with_labeled_refs_does_not_keep_file_handles_open(self, tmp_path, fd_count):
        img_path = tmp_path / "ref.png"
        Image.new("RGB", (16, 16), (255, 0, 0)).save(img_path)

        client = object.__new__(GeminiClient)
        client.SKIP_NAME_PATTERNS = GeminiClient.SKIP_NAME_PATTERNS

        baseline = fd_count()
        retained_contents = []
        for _ in range(40):
            retained_contents.append(
                client._build_contents_with_labeled_refs("test prompt", [img_path])
            )
        after = fd_count()

        # Allow a small buffer for unrelated runtime FDs.
        if baseline >= 0 and after >= 0:
            assert after <= baseline + 5, f"FD count grew unexpectedly: baseline={baseline}, after={after}"

        # Explicit cleanup for test process hygiene.
        for content in retained_contents:
            for item in content:
                if isinstance(item, Image.Image):
                    item.close()

    def test_analyze_style_image_uses_detached_image_when_input_is_path(self, tmp_path):
        img_path = tmp_path / "style.png"
        Image.new("RGB", (8, 8), (0, 128, 255)).save(img_path)

        client = object.__new__(GeminiClient)
        client.client = _FakeClient()

        result = client.analyze_style_image(img_path, model="fake-model")

        assert result == "cinematic, dramatic lighting"
        assert len(client.client.models.observed_fps) == 1
        assert client.client.models.observed_fps[0] is None
