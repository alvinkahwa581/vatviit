use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../lib";
use Test::More;
use Test::Mojo;
use VaTViT::Core;

my $t = Test::Mojo->new(VaTViT::Core->new);
$t->get_ok('/health')
  ->status_is(200)
  ->json_is('/status' => 'ok')
  ->json_is('/service' => 'vatvit-core-perl');
$t->get_ok('/v1/capabilities')
  ->status_is(200)
  ->json_is('/order_execution' => 'disabled')
  ->json_is('/market_data_mode' => 'read_only');

done_testing;
