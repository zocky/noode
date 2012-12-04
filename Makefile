# Edited for Debian GNU/Linux
DESTDIR =

PROGS = bin/noode
BIN   = $(DESTDIR)/usr/bin
SHARE = $(DESTDIR)/usr/share/noode

build:

install: build
	@echo "Installing in ${DESTDIR}"
	install -d $(BIN)
	install $(PROGS) $(BIN)
	install -d $(SHARE)
	install index.js $(SHARE)

# meta stuff

package: tarball
	debuild -us -uc

clean:
	find . -name '*~' | xargs rm -f 
	rm -f make.log

tarball: clean
	cd .. ; tar czvf noode_0.1.orig.tar.gz noode-0.1 >> make.log

