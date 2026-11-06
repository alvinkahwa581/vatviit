package VaTViT::Core;
use Mojo::Base 'Mojolicious', -signatures;

sub startup ($self) {
  my $routes = $self->routes;
  $routes->get('/health' => sub ($c) {
    $c->render(json => { status => 'ok', service => 'vatvit-core-perl' });
  });
  $routes->get('/v1/capabilities' => sub ($c) {
    $c->render(json => {
      market_data_mode => 'read_only',
      order_execution => 'disabled',
      paper_trading => 'external_simulator_only',
    });
  });
}

1;
