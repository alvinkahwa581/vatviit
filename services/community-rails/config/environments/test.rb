Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = false
  config.secret_key_base = "test-only-" + ("x" * 64)
end
